import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { AppController } from "../src/app.controller";
import { RequirementService } from "../src/llm/requirement.service";
import type { TestingModule } from "@nestjs/testing";

describe("POST /requirement/extract", () => {
  let moduleRef: TestingModule;
  let controller: AppController;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
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

    controller = moduleRef.get(AppController);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("should return structured requirement result", async () => {
    const input = "用户注册时必须绑定手机号，密码至少8位";

    const response = await controller.extract({ input });

    expect(response).toHaveProperty("action");
    expect(response).toHaveProperty("constraints");
    expect(response).toHaveProperty("entities");
    expect(Array.isArray(response.constraints)).toBe(true);
    expect(Array.isArray(response.entities)).toBe(true);
  });
});
