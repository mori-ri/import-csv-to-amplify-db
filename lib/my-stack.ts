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
    const importerCsvToAmplifyDb = new lambda.Function(
      this,
      "ImporterCsvToAmplifyDb",
      {
        functionName: "importer-csv-to-amplify-db",
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("src/ImporterCsvToAmplifyDb"),
        handler: "index.handler",
        timeout: cdk.Duration.minutes(10),
      }
    );

    const graphqlToCsvJson = new lambda.Function(this, "GraphqlToCsvJson", {
      functionName: "graphql-to-csv-json",
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("src/GraphqlToCsvJson"),
      handler: "index.handler",
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
    });

    // Lambda Permissions
    const dynamoDbPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:BatchWriteItem",
      ],
      effect: iam.Effect.ALLOW,
      resources: ["arn:aws:dynamodb:*:*:table/*"],
    });

    const s3Policy = new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [bucket.bucketArn + "/*"],
    });

    importerCsvToAmplifyDb.addToRolePolicy(dynamoDbPolicy);
    importerCsvToAmplifyDb.addToRolePolicy(s3Policy);
    graphqlToCsvJson.addToRolePolicy(s3Policy);

    // S3 Event Trigger
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importerCsvToAmplifyDb),
      { suffix: ".csv" }
    );
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(graphqlToCsvJson),
      { suffix: ".graphql" }
    );
  }
}
