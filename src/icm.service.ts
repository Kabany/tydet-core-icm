import { Context, Service } from "tydet-core"
import { IcmError } from "./icm.error"
import { readFileSync } from "fs"
import { DateUtils } from "tydet-utils"
import * as jwt from "jsonwebtoken"
import axios from "axios"
import { devNull } from "os"
import { KabanyIcmFile } from "./dto/icmFile.dto"
import { IcmInfo } from "./dto/icmInfo.dto"
import { Project, ProjectEnvironment } from "./dto/project.dto"
import { PaginationInfo } from "./dto/pagination.dto"

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
      return result.data.data as IcmInfo
    } catch(err) {
      throw new IcmError("An error ocurred with the request getTokenInfo", err)
    }
  }

  async getProjects(per: number = 1000, page: number = 1) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.baseUrl + `/projects?per=${per > 1000 ? 1000 : per}&page=${page}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as {projects: Project[], pagination: PaginationInfo}
    } catch(err) {
      throw new IcmError("An error ocurred with the request getProjects", err)
    }
  }

  async createProject(name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.post(this.baseUrl + `/projects`, {
        name
      }, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as Project
    } catch(err) {
      throw new IcmError("An error ocurred with the request createProject", err)
    }
  }

  async getProject(name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.baseUrl + `/projects/${name}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as Project
    } catch(err) {
      throw new IcmError("An error ocurred with the request getProject", err)
    }
  }

  async updateProject(projectName: string, newName: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.put(this.baseUrl + `/projects/${projectName}`, {
        name: newName
      }, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as Project
    } catch(err) {
      throw new IcmError("An error ocurred with the request getProject", err)
    }
  }

  async removeProject(name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.delete(this.baseUrl + `/projects/${name}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as Project
    } catch(err) {
      throw new IcmError("An error ocurred with the request getProject", err)
    }
  }

  async getEnvironments(project: string, per: number = 1000, page: number = 1) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.baseUrl + `/projects/${project}/environments?per=${per > 1000 ? 1000 : per}&page=${page}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as {environments: ProjectEnvironment[], pagination: PaginationInfo}
    } catch(err) {
      throw new IcmError("An error ocurred with the request getEnvironments", err)
    }
  }

  async createEnvironment(project: string, name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.post(this.baseUrl + `/projects/${project}/environments`, {
        name
      }, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as ProjectEnvironment
    } catch(err) {
      throw new IcmError("An error ocurred with the request createEnvironment", err)
    }
  }

  async getEnvironment(project: string, name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.get(this.baseUrl + `/projects/${project}/environments/${name}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as ProjectEnvironment
    } catch(err) {
      throw new IcmError("An error ocurred with the request getEnvironment", err)
    }
  }

  async updateEnvironment(project: string, environment: string, newName: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.put(this.baseUrl + `/projects/${project}/environments/${environment}`, {
        name: newName
      }, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as ProjectEnvironment
    } catch(err) {
      throw new IcmError("An error ocurred with the request updateEnvironment", err)
    }
  }

  async removeEnvironment(project: string, name: string) {
    let at = await this.getAccessToken()
    try {
      let result = await axios.delete(this.baseUrl + `/projects/${project}/environments/${name}`, { headers: {
        "Authorization": `Bearer ${at}`
      }})
      return result.data.data as Project
    } catch(err) {
      throw new IcmError("An error ocurred with the request removeEnvironment", err)
    }
  }
}

