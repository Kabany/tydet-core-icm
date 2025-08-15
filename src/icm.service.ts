import { Context, Service } from "tydet-core"
import { IcmError } from "./icm.error"
import { readFileSync } from "fs"
import { DateUtils } from "tydet-utils"
import * as jwt from "jsonwebtoken"
import axios from "axios"
import { devNull } from "os"

export interface KabanyIcmFile {
  type: string
  private_key_id: number
  private_key_name: string
  private_key: string
  access_domain: string
  auth_url: string
}

const PATH_FILE = "PATH_FILE";

export class ICM extends Service {
  private pathFile: string
  private icmFile: KabanyIcmFile
  private baseUrl: string
  private accessToken: string
  private lastSync: Date

  constructor(icmPathFile: string) {
    let map = new Map()
    map.set(PATH_FILE, icmPathFile);
    super(map);
  }

  override async beforeMount(context: Context) {
    let errors: any = {}
    if (!this.params.has(PATH_FILE)) {
      throw new IcmError("Path to Key File is missing");
    }
    await super.beforeMount(context)
  }

  override async onMount() {
    try {
      this.pathFile = this.params.get(PATH_FILE) as string
      let f = readFileSync(this.pathFile, "utf8")
      this.icmFile = JSON.parse(f)
      if (this.icmFile.type != "internal-credential-key") {
        throw new IcmError("Invalid key file")
      }
      this.baseUrl = this.icmFile.auth_url.replace("/auth/token", "")
      
    } catch(err) {
      throw new IcmError("Missing or invalid key file")
    }
  }

  override async onReset() {
    this.lastSync = null
    this.icmFile = null
    this.icmFile = null
    this.accessToken = null
    this.baseUrl = devNull
    try {
      this.pathFile = this.params.get(PATH_FILE) as string
      let f = readFileSync(this.pathFile, "utf8")
      this.icmFile = JSON.parse(f)
      if (this.icmFile.type != "internal-credential-key") {
        throw new IcmError("Invalid key file")
      }
      this.baseUrl = this.icmFile.auth_url.replace("/auth/token", "")
      
    } catch(err) {
      throw new IcmError("Missing or invalid key file")
    }
  }

  override async onEject() {
    this.lastSync = null
    this.icmFile = null
    this.icmFile = null
    this.accessToken = null
    this.baseUrl = devNull
  }



  private createJwt() {
    let payload: any = {
      iss: this.icmFile.private_key_name,
      iid: this.icmFile.private_key_id,
      sub: this.icmFile.access_domain,
      aud: this.icmFile.auth_url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60
    }
    let token = jwt.sign(payload, this.icmFile.private_key, { algorithm: "RS256" })
    return token
  }

  private async requestToken(requester: string) {
    try {
      let result = await axios.post(this.icmFile.auth_url, {
        assertion: requester
      })
      return result.data.data.access_token
    } catch(err) {
      throw new IcmError("An error ocurred when requesting an access token with the provider", err)
    }
  }

  async getAccessToken() {
    if (this.lastSync == null || DateUtils.minutesOfDifference(new Date(), this.lastSync) > 50) {
      let token = this.createJwt()
      this.accessToken = await this.requestToken(token)
      this.lastSync = new Date()
    }
    return this.accessToken
  }

  async getTokenInfo() {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.icmFile.auth_url + "/info", { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as {id: number, name: string, domain: string}
    } catch(err) {
      throw new IcmError("An error ocurred with the request getTokenInfo", err)
    }
  }

  async getProjects() {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.icmFile.auth_url + "/info", { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as {id: number, name: string, domain: string}
    } catch(err) {
      throw new IcmError("An error ocurred with the request getTokenInfo", err)
    }
  }
}

