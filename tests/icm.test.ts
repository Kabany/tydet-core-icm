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
    let list = await icm.getProjects()
    expect(list.projects.length).toBe(0)

    let newProject = await icm.createProject("new_project")
    expect(newProject.name).toBe("new_project")
    expect(newProject.id).not.toBeNull()

    list = await icm.getProjects()
    expect(list.projects.length).toBe(1)

    let updated = await icm.updateProject(newProject.name, "updated_project")
    expect(updated.name).toBe("updated_project")
    expect(updated.id).toBe(newProject.id)

    await icm.removeProject(updated.name)
    list = await icm.getProjects()
    expect(list.projects.length).toBe(0)
  })

  it("should test all CRUD operations for project environments", async () => {
    let newProject = await icm.createProject("environment_project")
    expect(newProject.name).toBe("environment_project")
    expect(newProject.id).not.toBeNull()

    icm.setProject(newProject.name)

    let newEnv = await icm.createEnvironment("new_environment")
    expect(newEnv.name).toBe("new_environment")
    expect(newEnv.id).not.toBeNull()
    expect(newEnv.projectId).toBe(newProject.id)

    let updated = await icm.updateEnvironment("new_environment", "updated_environment")
    expect(updated.name).toBe("updated_environment")
    expect(updated.projectId).toBe(newProject.id)
    expect(updated.id).toBe(newEnv.id)

    let environments = await icm.getEnvironments()
    expect(environments.environments.length).toBe(1)

    await icm.removeEnvironment("updated_environment")
    environments = await icm.getEnvironments()
    expect(environments.environments.length).toBe(0)
    
    await icm.removeProject(newProject.name)
    icm.clear()
  })

  it("should test all CRUD operations for project parameters", async () => {
    let newProject = await icm.createProject("parameter_project")
    expect(newProject.name).toBe("parameter_project")
    expect(newProject.id).not.toBeNull()

    icm.setProject(newProject.name)

    let newParam = await icm.createParameter("new_parameter")
    expect(newParam.name).toBe("new_parameter")
    expect(newParam.id).not.toBeNull()
    expect(newParam.projectId).toBe(newProject.id)

    let updated = await icm.updateParameter("new_parameter", "updated_parameter")
    expect(updated.name).toBe("updated_parameter")
    expect(updated.projectId).toBe(newProject.id)
    expect(updated.id).toBe(newParam.id)

    let parameters = await icm.getParameters()
    expect(parameters.parameters.length).toBe(1)

    await icm.removeParameter("updated_parameter")
    parameters = await icm.getParameters()
    expect(parameters.parameters.length).toBe(0)
    
    await icm.removeProject(newProject.name)
    icm.clear()
  })

  it("should test all CRUD operations for project values", async () => {
    let newProject = await icm.createProject("test_project")
    expect(newProject.name).toBe("test_project")
    expect(newProject.id).not.toBeNull()

    icm.setProject(newProject.name)

    let newParam = await icm.createParameter("new_parameter")
    let newEnv = await icm.createEnvironment("new_environment")

    icm.setEnvironment(newEnv.name)

    let value = await icm.createValue(newParam.name, "new_value")
    expect(value).toBe(true)

    let compare = await icm.getValue(newParam.name)
    expect(compare).toBe("new_value")

    let updated = await icm.updateValue(newParam.name, "updated_value")
    expect(updated).toBe(true)

    compare = await icm.getValue(newParam.name)
    expect(compare).toBe("updated_value")

    await icm.removeValue(newParam.name)
    compare = await icm.getValue(newParam.name)
    expect(compare).toBeNull()

    await icm.removeEnvironment(newEnv.name)
    await icm.removeParameter(newParam.name)
    await icm.removeProject(newProject.name)
    icm.clear()
  })

  afterAll(async () => {
    // close service
    await app.ejectAllServices()
  })
})