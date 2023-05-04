# Implementing bulk CSV ingestion to Amplify DynamoDB

This serverless application is designed to import CSV files from an Amazon S3 bucket into an Amazon DynamoDB table for Amplify using AWS Lambda. It reads CSV files uploaded to the S3 bucket, processes them, and inserts the data into the corresponding DynamoDB table. Upon successful import, the CSV file is moved to a `completed` directory within the S3 bucket.

This can be used to download and re-import CSVs for data migration when tables are redefined in Amplify, or to restore CSVs created for backup.

## Features

- Serverless architecture using AWS Lambda
- Triggered by S3 events when a new CSV and schema file is uploaded
- Supports different column types defined in a separate JSON file
- Validates CSV headers against JSON column definitions
- JSON file defining the type for each column is automatically generated from schema.graphql
- Batch write to DynamoDB for efficient data insertion
- Moves successfully processed CSV files to a `completed` directory with a timestamp

## Prerequisites

- AWS account with appropriate permissions to create and manage resources
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Node.js](https://nodejs.org/) 12.x or later installed
- [AWS CDK](https://aws.amazon.com/cdk/) installed (Version 2.x)


## Deployment

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/csv-to-dynamodb-importer.git
   cd csv-to-dynamodb-importer
   ```

2. Install the necessary dependencies:

   ```
   npm install
   ```

3. Bootstrap your AWS environment (if you haven't already):

   ```
   cdk bootstrap
   ```

4. The appropriate AWS account and region must be set up during the CDK template.

5. Deploy the application to your AWS account:

   ```
   cdk deploy
   ```

## Usage

1. Upload the GraphQL schema file (`schema.graphql`) to the S3 bucket. This will trigger the `graphqlToCsvJsonFunction` Lambda function and generate the corresponding typedef JSON file.

   ```
   <random strings>-<amplify env name>/schema.graphql
   ```

   Replace `<random strings>-<amplify env name>` with your desired name of Dynamo DB table  to be written： `<TableName>-<random strings>-<amplify env name>`(exsample: If `Todo-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-dev` is name of write table, set `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-dev` to key of object.)

   Note: To mark a column as required, append "!" to the type, e.g., `"id": "String!"`.

2. Upload a CSV file to the same S3 bucket with the following naming convention:

   ```
   <random strings>-<amplify env name>/<TableName>.csv
   ```

   Replace `<TableName>` with the name of the target DynamoDB table.

   The Lambda function will automatically process the uploaded CSV file, validate it against the JSON column definitions, and insert the data into the specified DynamoDB table. 

3. If successful, the CSV file will be moved to `completed` directory within the S3 bucket.

Note: This process will only process object types that have an `@model` directive in the GraphQL schema.

### Types used in AppSync and types used in DynamoDB

| AppSync (GraphQL) | DynamoDB          |
|-------------------|-------------------|
| ID                | String            |
| String            | String            |
| Int               | Number            |
| Float             | Number            |
| Boolean           | Boolean           |
| AWSDateTime       | String            |
| AWSDate           | String            |
| AWSTime           | String            |
| AWSTimestamp      | Number            |
| AWSJSON           | String            |
| AWSPhone          | String            |
| AWSEmail          | String            |
| AWSURL            | String            |
| AWSIPAddress      | String            |
| * other type      | String            |


## License

This project is open-source and available under the [MIT License](LICENSE).
