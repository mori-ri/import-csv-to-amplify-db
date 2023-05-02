// bin/app.ts
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/my-stack";

const app = new cdk.App();
new MyStack(app, "MyStack", {
  env: {
    region: "ap-northeast-1", // 例: "us-west-2"
  },
});
app.synth();
