import React, { Component } from "react"
import Toggle from "material-ui/Toggle"
import TextField from "material-ui/TextField"

export default class RuleCell extends Component {
  constructor(props) {
    super(props)
    this.state = {
      enabled: false,
      value: ""
    }
  }

  handleToggleChange = changedBool => {
    this.setState({
      enabled: changedBool
    })
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps)
    let returnVal = ""
    if (nextProps.cellData) {
      returnVal = nextProps.cellData
    }
    this.setState({
      enabled: !!nextProps.cellData,
      value: returnVal
    })
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <div style={{ width: "50px" }}>
          <Toggle
            toggled={this.state.enabled}
            onToggle={(e, inputChecked) => {
              this.props.onToggle(
                this.props.identifier,
                this.props.condition,
                inputChecked,
                this.state.value
              )
              this.handleToggleChange(inputChecked)
            }}
          />
        </div>
        <div>
          <TextField
            value={this.state.value}
            onChange={(event, newValue) => {
              this.setState({ value: newValue })
              this.props.changeRuleFromDevice(
                this.props.identifier,
                this.props.condition,
                newValue
              )
            }}
            style={{ width: "40px" }}
            floatingLabelText={this.props.text}
            disabled={!this.state.enabled}
          />
        </div>
      </div>
    )
  }
}
