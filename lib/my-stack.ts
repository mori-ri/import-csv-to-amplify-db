// lib/my-stack.ts
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const bucketName = `import-csv-to-amplify-db-${this.account}`;
    const bucket = new s3.Bucket(this, "ImportCsvToAmplifyDbBucket", {
      bucketName: bucketName,
    });

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, "ImporterCsvToAmplifyDb", {
      functionName: "importer-csv-to-amplify-db",
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("src"),
      handler: "index.handler",
      timeout: cdk.Duration.minutes(10),
    });

    // Lambda Permissions
    const dynamoDbPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem", "dynamodb:UpdateItem"],
      effect: iam.Effect.ALLOW,
      resources: ["arn:aws:dynamodb:*:*:table/*"],
    });

    const s3ReadPolicy = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      effect: iam.Effect.ALLOW,
      resources: [bucket.arnForObjects("*")],
    });

    lambdaFunction.addToRolePolicy(dynamoDbPolicy);
    lambdaFunction.addToRolePolicy(s3ReadPolicy);

    // S3 Event Trigger
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(lambdaFunction)
    );
  }
}
