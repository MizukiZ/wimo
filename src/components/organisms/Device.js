import React, { Component } from "react"
import * as deviceWebSocket from "../../api/deviceWebSockets"
import {
  getModel as getDeviceModel,
  update as updateDevice,
  getAlertConfig,
  updateAlertConfig,
  getSingle as getDevice
  // setAlertSettings as setDeviceAlertSettings,
  // getAlertSettings as getDeviceAlertSettings
} from "../../api/device"
import CircularProgress from "material-ui/CircularProgress"
import Menu from "material-ui/Menu"
import MenuItem from "material-ui/MenuItem"
import Slider from "material-ui/Slider"
import DeviceSettingsDialog from "../molecules/DeviceSettingsDialog"
import LineGraph from "../molecules/LineGraph"
import moment from "moment"
import { toast, ToastContainer } from "react-toastify"
import CrossIcon from "react-icons/lib/fa/times-circle"
require("moment-duration-format")

function sorter(data, dataKeys) {
  /* function to sort data into
  {key:
    {
      values: [all the values],
      rangeX: {min: minOfX, max: maxOfX}
      rangeY: {min: minOfY, max: maxOfY}
    }
  }
  */

  let sortedValues = {}
  if (data != null) {
    dataKeys.forEach(key => {
      sortedValues[key] = {}
      sortedValues[key].values = []
      for (let i = 0; i < data.length; i++) {
        let time = data[i]["_ts"]

        sortedValues[key].values.push({ ts: time, value: data[i][key] })
      }
      let allX = sortedValues[key].values.map(val => moment(val.ts))
      let allY = sortedValues[key].values.map(val => val.value)
      let minX = Math.min.apply(null, allX)
      let maxX = Math.max.apply(null, allX)
      let minY = Math.min.apply(null, allY)
      let maxY = Math.max.apply(null, allY)

      sortedValues[key]["rangeX"] = {
        min: moment(minX).toDate(),
        max: moment(maxX).toDate()
      }
      sortedValues[key]["rangeY"] = {
        min: minY,
        max: maxY
      }
    })
  }
  return sortedValues
}

function getOnlyConditions(alertSettings) {
  let mutableAlertSettings = { ...alertSettings }
  delete mutableAlertSettings.alertSettings
  return mutableAlertSettings
}
export default class DeviceInfo extends Component {
  alertSettings
  // Determines which graphs get rendered
  allGraphs = []
  deviceData = {}
  constructor(props) {
    super(props)
    this.state = {
      data: null,
      hoursBackShown: 3,
      newDeviceName: this.deviceData.name,
      hoursBack: 3,
      loaderShown: false,
      keysShown: [],
      selectedGraphKey: null,
      originalRules: null,
      rules: null
    }
    this.defaultChange = null
  }

  originalShownKeys

  async componentDidMount() {
    deviceWebSocket.getDevicesData(
      this.props.deviceId,
      this.updateData,
      this.state.hoursBack,
      this.handleUpdateData
    )
    Promise.all([
      getDeviceModel(this.props.deviceId),
      getDevice(this.props.deviceId),
      getAlertConfig(this.props.deviceId)
    ])
      .then(([model, deviceData, deviceAlertSettings]) => {
        this.setState({
          rules: deviceAlertSettings.alertconfig,
          originalRules: deviceAlertSettings.alertconfig
        })
        this.deviceData = deviceData
        this.setState({ newDeviceName: deviceData.name })
        this.alertSettings = deviceAlertSettings.alertconfig.selectedKey
        this.allGraphs = model.map(modelData => {
          return {
            displayTitle: modelData.title,
            key: modelData.reference,
            unit: modelData.unit
          }
        })
        this.getDeviceSettings()
      })
      .catch(error => {
        // this.props.handleError(error)
        console.error(error)
      })
  }

  componentWillReceiveProps({ deviceId }) {
    // when device id has been changed this will happen
    this.setState({
      data: null
    })
    deviceWebSocket.getDevicesData(
      this.props.deviceId,
      this.updateData,
      this.state.hoursBack,
      this.handleUpdateData
    )
    Promise.all([
      getDeviceModel(this.props.deviceId),
      getDevice(this.props.deviceId),
      getAlertConfig(this.props.deviceId)
    ])
      .then(([model, deviceData, deviceAlertSettings]) => {
        this.setState({
          rules: deviceAlertSettings.alertconfig,
          originalRules: deviceAlertSettings.alertconfig
        })
        this.deviceData = deviceData
        this.alertSettings = deviceAlertSettings.alertconfig.selectedKey
        this.allGraphs = model.map(modelData => {
          return {
            displayTitle: modelData.title,
            key: modelData.reference,
            unit: modelData.unit
          }
        })
        this.getDeviceSettings()
      })
      .catch(error => {
        // this.props.handleError(error)
        console.error(error)
      })
  }

  determineGraphsWithClass = allGraphs => {
    this.state.keysShown.forEach(graphShown => {
      allGraphs.forEach(graph => {
        if (graphShown.key === graph.key) {
          graph.display = true
          // Optimasation issue, loop will keep running even when matched
        }
      })
    })
    return allGraphs
  }

  updateData = newData => {
    this.setState({
      data: newData,
      loaderShown: false
    })
  }

  handleUpdateData = newData => {
    let mutableData = this.state.data.slice()
    mutableData.unshift(newData)
    this.setState({
      data: mutableData
    })
  }

  handleSliderStop = value => {
    deviceWebSocket.getDevicesData(
      this.props.deviceId,
      this.updateData,
      value,
      this.handleUpdateData
    )
    this.setState({
      hoursBack: value,
      loaderShown: true,
      hoursBackShown: value
    })
  }

  handleSlider = value => {
    this.setState({
      hoursBackShown: value
    })
  }

  getBatteryPercentage = latestBattery => {
    // Getting the percentage of how far between two points.
    let lower = 2.31
    let upper = 2.794
    let value = latestBattery
    let percentage = (value - lower) / (upper - lower)
    return percentage * 100
  }

  handleGraphDelete = graphKey => {
    if (graphKey !== this.state.selectedGraphKey) {
      this.setState({
        keysShown: this.state.keysShown.filter(graphShown => {
          return graphShown.key !== graphKey
        })
      })
    } else {
      this.setState({
        keysShown: this.state.keysShown.filter(
          graphShown => graphShown.key !== graphKey
        ),
        selectedGraphKey: null
      })
    }
    this.allGraphs = this.allGraphs.map(graph => {
      graph.display = false
      return graph
    })
  }

  handleGraphAdd = graphKey => {
    let elementToAdd = this.allGraphs.find(graph => graph.key === graphKey)
    this.setState({
      keysShown: this.state.keysShown.concat(elementToAdd)
    })
    this.allGraphs = this.allGraphs.map(graph => {
      graph.display = false
      return graph
    })
  }

  handleGraphSelect = selectedGraphKey => {
    this.setState({ selectedGraphKey: selectedGraphKey })
  }

  saveGraphSettings = object => {
    localStorage.setItem("graphPreference", JSON.stringify(object))
    return object
  }

  getGraphSettings = () => {
    return localStorage.graphPreference
  }

  getDeviceSettings = () => {
    // Graph Preference
    const selectedKey = this.alertSettings
    let array = []
    // chose what you need to show
    selectedKey.forEach(settingCondition => {
      array.push(this.allGraphs.find(graph => graph.key === settingCondition))
    })
    this.setState({ keysShown: array })
  }

  saveDeviceSettings = rules => {
    // setDeviceAlertSettings(this.props.deviceId, rules, this.handleAlerts)
    updateDevice(this.deviceData.id, { new_name: this.state.newDeviceName })
    //todo save device name
  }

  changeRule = (key, condition, value) => {
    const reverseCondition = condition === "GT" ? "LT" : "GT"
    // Turn values into such usable format
    let rules = { ...this.state.rules }

    if (value) {
      // when value is there

      // if the key exists make empty object container
      if (!rules[key]) {
        rules[key] = {}
      }
      rules[key][condition] = Number(value)
      if (!rules[key][reverseCondition]) {
        // if the other condition is empty put null
        rules[key][reverseCondition] = null
      }
    } else {
      // when value is not there

      if (rules[key][condition]) {
        // put null for the empty field
        rules[key][condition] = null
      }

      if (
        //WTF
        Object.keys(rules[key]).length === 0 &&
        rules[key].constructor === Object
      ) {
        delete rules[key]
      }
    }

    this.setState({ rules: rules })
  }

  onToggle = (key, condition, toggleVal, fieldValue) => {
    const reverseCondition = condition === "GT" ? "LT" : "GT"
    console.log(key, condition, toggleVal, fieldValue)
    let rules = { ...this.state.rules }
    if (toggleVal) {
      // off -> on
      if (fieldValue) {
        // if value is there
        if (!rules[key]) {
          // if doesn't exist make new container
          rules[key] = {}
        }
        rules[key][condition] = Number(fieldValue)
      } else {
        // if key exists
        rules[key][condition] = this.state.originalRules[key][condition]
      }
    } else {
      // on -> off
      if (rules[key]) {
        // if the key exists
        if (rules[key][condition]) {
          // put null to the field
          rules[key][condition] = null
        }
        if (
          //wtf

          Object.keys(rules[key]).length === 0 &&
          rules[key].constructor === Object
        ) {
          delete rules[key]
        }
      }
    }
    this.setState({ rules: rules })
  }

  handleAlerts = (err, res) => {
    if (err) {
      toast.error("Failed to update settings, please try later")
    } else {
      toast.success("Successfully saved settings")
    }
  }

  updateDeviceName = newDeviceName => {
    this.setState({ newDeviceName: newDeviceName })
  }

  cancelSetting = () => {
    getAlertConfig(this.props.deviceId).then(alertConfigData => {
      this.setState({ rules: alertConfigData.alertconfig })
    })
  }

  resetGraphsShown = () => {}

  checkIfOutOfRange = (key, value) => {
    if (value === null) return
    let upperlimit = this.state.rules[key]["GT"]
    let lowerlimit = this.state.rules[key]["LT"]
    if (!upperlimit && lowerlimit > value) return "warning"
    else if (!upperlimit && lowerlimit < value) return ""
    else if (!lowerlimit && upperlimit < value) return "warning"
    else if (!lowerlimit && upperlimit > value) return ""
    else if (lowerlimit > value || upperlimit < value) return "warning"
    else return ""
  }

  render() {
    const sortedGraphs = this.determineGraphsWithClass(this.allGraphs)
    const sortedData = sorter(
      this.state.data,
      this.allGraphs.map(graph => graph.key)
    )
    let alertConditions = getOnlyConditions(this.alertSettings)
    return (
      <div style={{ textAlign: "center" }}>
        <ToastContainer
          position="top-right"
          type="default"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
        {this.state.data ? (
          <div>
            {!!this.state.data.length ? (
              <div
                className="the-first"
                style={{
                  textAlign: "center",
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              >
                <h1>
                  {this.state.newDeviceName
                    ? this.state.newDeviceName
                    : "No Name"}
                </h1>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center"
                  }}
                />

                {/* Current Status */}

                <div className="status-container">
                  <div className="section-header">
                    <div className="status-title-block">
                      <h2 className="status-title">Current Status</h2>
                      <p className="status-data-age">
                        Data last updated{" "}
                        {moment
                          .duration(
                            moment().diff(
                              moment(
                                sortedData[Object.keys(sortedData)[0]].values[0]
                                  .ts
                              )
                            )
                          )
                          .format("k[hr] m[min] s[sec ago]")}
                      </p>
                    </div>
                    {sortedGraphs.length > 0 ? (
                      <DeviceSettingsDialog
                        resetGraphsShown={this.resetGraphsShown}
                        newDeviceName={this.updateDeviceName}
                        alertSettings={this.alertSettings}
                        saveSettings={this.saveDeviceSettings}
                        updateDevice={updateDevice}
                        handleGraphDelete={this.handleGraphDelete}
                        handleGraphAdd={this.handleGraphAdd}
                        sortedGraphs={sortedGraphs}
                        deviceData={this.deviceData}
                        keysShown={this.state.keysShown}
                        changeRuleFromDevice={this.changeRule}
                        onToggleFromDevice={this.onToggle}
                        rulesFromDevice={this.state.rules}
                        cancelSetting={this.cancelSetting}
                      />
                    ) : (
                      <CircularProgress />
                    )}
                  </div>
                  {this.state.keysShown.length > 0 ? (
                    <div>
                      <div className="status-data-array">
                        {this.state.keysShown.map(keyShown => (
                          <div
                            className="status-data-element"
                            key={keyShown.key}
                          >
                            <p className="status-data-type">
                              {keyShown.displayTitle}
                            </p>

                            {this.state.rules && (
                              <h3
                                className={`status-data-value ${this.checkIfOutOfRange(
                                  keyShown.key,
                                  sortedData[keyShown.key].values[0].value
                                    ? sortedData[
                                        keyShown.key
                                      ].values[0].value.toFixed(1)
                                    : null
                                )}`}
                              >
                                {sortedData[keyShown.key].values[0].value &&
                                  sortedData[
                                    keyShown.key
                                  ].values[0].value.toFixed(1)}{" "}
                                {keyShown.unit}
                              </h3>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="selection-prompt-container">
                      <h1 className="selection-prompt">
                        Select sensors from the settings menu to view live data
                      </h1>
                    </div>
                  )}
                </div>

                {/* Data Analysis */}

                <div className="analysis-container">
                  <div className="section-header">
                    <h2 className="analysis-title">Data Analysis</h2>
                  </div>
                  <div className="analysis-slider">
                    {!this.state.loaderShown ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginLeft: "auto",
                          marginRight: "auto"
                        }}
                      >
                        <div className="slider-range">
                          <h5 className="range-title">data range</h5>
                          <h5 className="range-value">
                            {`${this.state.hoursBackShown} hours`}
                          </h5>
                        </div>
                        <Slider
                          style={{ width: "65%" }}
                          min={1}
                          max={24}
                          step={1}
                          value={this.state.hoursBack}
                          onChange={(event, value) => {
                            this.defaultChange = value
                            this.handleSlider(value)
                          }}
                          onDragStop={() => {
                            this.defaultChange > 0 &&
                              this.handleSliderStop(this.defaultChange)
                          }}
                        />
                      </div>
                    ) : (
                      <CircularProgress />
                    )}
                  </div>
                  <div className="graph-block">
                    <div className="graph-menu">
                      <Menu>
                        {sortedGraphs.map(keyShown => (
                          <div key={`${keyShown.key}Graph`}>
                            <MenuItem
                              style={
                                keyShown.key === this.state.selectedGraphKey
                                  ? { backgroundColor: "#fbeeee" }
                                  : { backgroundColor: "white" }
                              }
                              onTouchTap={() =>
                                this.handleGraphSelect(keyShown.key)
                              }
                              primaryText={keyShown.displayTitle}
                            />
                          </div>
                        ))}
                      </Menu>
                    </div>
                    <div className="graph">
                      {this.state.selectedGraphKey ? (
                        <LineGraph
                          graphPreference={sortedGraphs.find(
                            object => object.key === this.state.selectedGraphKey
                          )}
                          values={
                            sortedData[this.state.selectedGraphKey].values
                          }
                          rangeX={
                            sortedData[this.state.selectedGraphKey].rangeX
                          }
                          rangeY={
                            sortedData[this.state.selectedGraphKey].rangeY
                          }
                          upperlimit={
                            this.alertSettings &&
                            this.alertSettings[this.state.selectedGraphKey]
                              ? parseFloat(
                                  this.alertSettings[
                                    this.state.selectedGraphKey
                                  ]["GT"]
                                )
                              : null
                          }
                          lowerlimit={
                            this.alertSettings &&
                            this.alertSettings[this.state.selectedGraphKey]
                              ? parseFloat(
                                  this.alertSettings[
                                    this.state.selectedGraphKey
                                  ]["LT"]
                                )
                              : null
                          }
                        />
                      ) : (
                        false
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <h3>No Data Associated with this device</h3>
            )}
          </div>
        ) : (
          <CircularProgress />
        )}
      </div>
    )
  }
}
