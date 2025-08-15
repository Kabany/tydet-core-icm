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
    console.log(access_token)
    expect(access_token).not.toBeNull()
  })

  afterAll(async () => {
    // close service
    await app.ejectAllServices()
  })
})