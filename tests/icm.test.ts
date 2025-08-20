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

  it("should test all CRUD operations for project environments", async () => {
    let newProject = await icm.createProject("env_holder")
    expect(newProject.name).toBe("env_holder")
    expect(newProject.id).not.toBeNull()

    let newEnv = await icm.createEnvironment(newProject.name, "master")
    expect(newEnv.name).toBe("master")
    expect(newEnv.id).not.toBeNull()
    expect(newEnv.projectId).toBe(newProject.id)

    let updated = await icm.updateEnvironment(newProject.name, "master", "main")
    expect(updated.name).toBe("main")
    expect(updated.projectId).toBe(newProject.id)
    expect(updated.id).toBe(newEnv.id)

    let environments = await icm.getEnvironments(newProject.name)
    expect(environments.environments.length).toBe(1)

    await icm.removeEnvironment(newProject.name, "main")
    environments = await icm.getEnvironments(newProject.name)
    expect(environments.environments.length).toBe(0)
    
    await icm.removeProject(newProject.name)
  })

  it("should test all CRUD operations for project parameters", async () => {
    let newProject = await icm.createProject("param_holder")
    expect(newProject.name).toBe("param_holder")
    expect(newProject.id).not.toBeNull()

    let newParam = await icm.createParameter(newProject.name, "master")
    expect(newParam.name).toBe("master")
    expect(newParam.id).not.toBeNull()
    expect(newParam.projectId).toBe(newProject.id)

    let updated = await icm.updateParameter(newProject.name, "master", "main")
    expect(updated.name).toBe("main")
    expect(updated.projectId).toBe(newProject.id)
    expect(updated.id).toBe(newParam.id)

    let parameters = await icm.getParameters(newProject.name)
    expect(parameters.parameters.length).toBe(1)

    await icm.removeParameter(newProject.name, "main")
    parameters = await icm.getParameters(newProject.name)
    expect(parameters.parameters.length).toBe(0)
    
    await icm.removeProject(newProject.name)
  })

  it("should test all CRUD operations for project values", async () => {
    let newProject = await icm.createProject("holder")
    expect(newProject.name).toBe("holder")
    expect(newProject.id).not.toBeNull()

    let newParam = await icm.createParameter(newProject.name, "my_name")
    expect(newParam.name).toBe("my_name")
    expect(newParam.id).not.toBeNull()
    expect(newParam.projectId).toBe(newProject.id)

    let newEnv = await icm.createEnvironment(newProject.name, "prod")
    expect(newEnv.name).toBe("prod")
    expect(newEnv.id).not.toBeNull()
    expect(newEnv.projectId).toBe(newProject.id)

    let value = await icm.createValue(newProject.name, newParam.name, newEnv.name, "This is my Name")
    expect(value).toBe(true)

    let compare = await icm.getValue(newProject.name, newParam.name, newEnv.name)
    expect(compare).toBe("This is my Name")

    let updated = await icm.updateValue(newProject.name, newParam.name, newEnv.name, "This is my New Name")
    expect(updated).toBe(true)

    compare = await icm.getValue(newProject.name, newParam.name, newEnv.name)
    expect(compare).toBe("This is my New Name")

    await icm.removeValue(newProject.name, newParam.name, newEnv.name)
    compare = await icm.getValue(newProject.name, newParam.name, newEnv.name)
    expect(compare).toBeNull()

    await icm.removeEnvironment(newProject.name, newEnv.name)
    await icm.removeParameter(newProject.name, newParam.name)
    await icm.removeProject(newProject.name)
  })

  afterAll(async () => {
    // close service
    await app.ejectAllServices()
  })
})