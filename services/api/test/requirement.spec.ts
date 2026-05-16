import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { RequirementService } from "../src/llm/requirement.service";

describe("POST /requirement/extract", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RequirementService)
      .useValue({
        extract: async () => ({
          action: "用户注册",
          constraints: ["必须绑定手机号", "密码至少8位"],
          entities: ["用户", "手机号", "密码"],
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return structured requirement result", async () => {
    const input = "用户注册时必须绑定手机号，密码至少8位";

    const response = await request(app.getHttpServer())
      .post("/requirement/extract")
      .send({ input })
      .expect(201);

    expect(response.body).toHaveProperty("action");
    expect(response.body).toHaveProperty("constraints");
    expect(response.body).toHaveProperty("entities");
    expect(Array.isArray(response.body.constraints)).toBe(true);
    expect(Array.isArray(response.body.entities)).toBe(true);
  });
});
