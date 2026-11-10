module.exports = {
  default: {
    paths: ["api/**/*.feature", "ui/**/*.feature"],
    requireModule: ["tsx/cjs"],
    require: [
      "support/**/*.ts",
      "shared/steps/**/*.ts",
      "api/steps/**/*.ts",
      "ui/steps/**/*.ts"
    ],
    format: ["progress", "allure-cucumberjs/reporter"]
  }
};
