import { Context } from "tydet-core"
import { ICM } from "../src/index"
import path from "path"

describe("ICM Service", () => {
  let app = new Context()
  let icm = new ICM(path.resolve(__dirname, "..", "local_key.json")) // change with the path to the ICM JSON file

  beforeAll(async () => {
    // prepare
    await app.mountService("icm", icm)
  })

  it("should get access token from the ICM app", async () => {
    let access_token = await icm.getAccessToken()
    //console.log(access_token)
    expect(access_token).not.toBeNull()
  })

  it("should get info from access token", async () => {
    let tokenInfo = await icm.getTokenInfo()
    expect(tokenInfo).not.toBeNull()
    expect(tokenInfo.id).not.toBeNull() 
    expect(tokenInfo.name).not.toBeNull()
    expect(tokenInfo.domain).not.toBeNull() 
  })

  it("should test all CRUD operations for projects", async () => {
    let projects = await icm.getProjects()
    expect(projects.projects.length).toBe(0)

    let newProject = await icm.createProject("first_project")
    expect(newProject.name).toBe("first_project")
    expect(newProject.id).not.toBeNull()

    let existing = await icm.getProject(newProject.name)
    expect(existing.name).toBe(newProject.name)
    expect(existing.id).toBe(newProject.id)

    let updated = await icm.updateProject(newProject.name, "second_project")
    expect(updated.name).toBe("second_project")
    expect(updated.id).toBe(newProject.id)

    projects = await icm.getProjects()
    expect(projects.projects.length).toBe(1)

    await icm.removeProject(updated.name)
    projects = await icm.getProjects()
    expect(projects.projects.length).toBe(0)
  })

  afterAll(async () => {
    // close service
    await app.ejectAllServices()
  })
})