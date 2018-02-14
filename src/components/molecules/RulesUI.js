import React, { Component } from "react"
import RuleRow from "../molecules/RuleRow"
import { getAlertConfig, updateAlertConfig } from "../../api/device"
import CircularProgress from "material-ui/CircularProgress"
import RaisedButton from "material-ui/RaisedButton"
import TextField from "material-ui/TextField"

export default class RulesUI extends Component {
  state = {
    rules: {},
    loading: true
    // numberTo: "",
    // alertMessage: ""
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  componentWillReceiveProps(nextProps) {
    let keys = nextProps.keysShown.map(shown => shown.key)
    let mutableRules = { ...this.props.rulesFromDevice }
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
                onToggle={this.props.onToggleFromDevice}
                changeRuleFromDevice={this.props.changeRuleFromDevice}
                ruleData={
                  this.props.rulesFromDevice
                    ? this.props.rulesFromDevice[rowPreference.key]
                    : null
                }
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
            // make data for post request
            const updateData = {}
            updateData["alertconfig"] = this.state.rules
            updateData["alertconfig"]["selectedKey"] = this.props.keysShown.map(
              key => key.key
            )

            updateAlertConfig(this.props.deviceId, updateData).then(() => {
              this.props.updateOriginalRuels()
            })
            this.props.handleClose()
          }}
          label="Save"
        />
        <RaisedButton
          onClick={() => {
            this.props.cancelSetting()
            this.props.handleClose()
          }}
          label="Cancel"
        />
      </div>
    ) : (
      <CircularProgress />
    )
  }
}
