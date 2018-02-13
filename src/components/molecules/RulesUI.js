import React, { Component } from "react"
import RuleRow from "../molecules/RuleRow"
import { getAlertConfig, updateAlertConfig } from "../../api/device"
import CircularProgress from "material-ui/CircularProgress"
import RaisedButton from "material-ui/RaisedButton"
import TextField from "material-ui/TextField"

function makeNumberStringInt(object) {
  Object.keys(object).forEach(key => {
    Object.keys(object[key]).forEach(condition => {
      let conditionInt = object[key][condition]
      object[key][condition] = parseFloat(conditionInt)
    })
  })
  return object
}

export default class RulesUI extends Component {
  state = {
    rules: {},
    loading: true
    // numberTo: "",
    // alertMessage: ""
  }

  /*
  {
    "_ts":{ "gt": time, "lt": time},
    "temperature":{ "gt": temp, "lt": temp},
    "humidity":{ "gt": humidity, "lt": humidity}
  }
  */

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

  // onInputChange = (e, newValue) => {
  //   this.setState({
  //     [e.target.id]: newValue
  //   })
  // }

  onToggle = (key, condition, toggleVal, fieldValue) => {
    const reverseCondition = condition === "GT" ? "LT" : "GT"

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

  componentDidMount() {
    getAlertConfig(this.props.deviceId).then(data => {
      this.setState({
        rules: data.alertconfig,
        loading: false
      })
    })
  }

  componentWillReceiveProps(nextProps) {
    let keys = nextProps.keysShown.map(shown => shown.key)
    let mutableRules = { ...this.state.rules }
    let object = {}
    keys.forEach(key => {
      if (mutableRules[key]) {
        object[key] = mutableRules[key]
      }
    })
    this.setState({ rules: object })
  }

  render() {
    return !this.state.loading ? (
      <div>
        <h3>Alert Settings</h3>
        <div>
          {this.props.keysShown.map(rowPreference => (
            <div key={rowPreference.key}>
              <RuleRow
                onToggle={this.onToggle}
                changeRule={this.changeRule}
                ruleData={this.state.rules[rowPreference.key]}
                title={rowPreference.displayTitle}
                identifier={rowPreference.key}
                unit={rowPreference.unit}
              />
              <br />
            </div>
          ))}
        </div>

        {/*  text message func
        <TextField
          id="numberTo"
          floatingLabelText="Phone Number"
          type="number"
          value={this.state.numberTo}
          onChange={this.onInputChange}
        />
        <TextField
          id="alertMessage"
          floatingLabelText="Alert Message"
          value={this.state.alertMessage}
          onChange={this.onInputChange}
        />*/}

        <br />
        <RaisedButton
          onClick={() => {
            const updateData = {}
            updateData["alertconfig"] = this.state.rules
            updateData["alertconfig"]["selectedKey"] = this.props.keysShown.map(
              key => key.key
            )

            this.props.handleClose()
            updateAlertConfig(this.props.deviceId, updateData).then(() => {
              this.props.reloadAlertSetting()
            })
          }}
          label="Save"
        />
        <RaisedButton onClick={this.props.handleClose} label="Cancel" />
      </div>
    ) : (
      <CircularProgress />
    )
  }
}
