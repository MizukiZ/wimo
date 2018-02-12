import axios from "axios"
import { rememberToken, getValidToken } from "./token"

const conctrKey = "conctrToken"
const profileDataKey = "profileDataToken"

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

// this instance is for the conctr get and insert api call
const api2 = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

api2.defaults.headers.post["Authorization"] = `api:${
  process.env.REACT_APP_DEVICE_API_KEY
}`

export function setToken(token) {
  rememberToken(token, conctrKey)
  if (token) {
    api.defaults.headers.common["Authorization"] = `jwt:${token}`
  } else {
    delete api.defaults.headers.common["Authorization"]
  }
  console.log(api.defaults)
}

setToken(getValidToken(conctrKey))

// if not valid token delete it
if (!getValidToken(profileDataKey)) {
  localStorage.removeItem(profileDataKey)
}

export default api
