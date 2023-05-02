## Implementing bulk CSV ingestion to Amplify DynamoDB

Amplify で作成した Dynamo DB に CSV ファイルを一括でインポートする方法を紹介します。
Amplify の DynamoDB は、AWS の DynamoDB とは違い、CSV ファイルを一括でインポートする機能がありません。データの移行のために CSV をダウンロードし、再度インポートするためのデザインです。

- Dynamo ー DB table name： `<table name>-<random strings>-<amplify env name>`
  - exsample: `Todo-xxxxxxxxxxxxxxxxxxxxxxxxxx-dev`
- S3 の Key 構成：`<random strings>-<amplify env name>/<table name>.csv`
- setting json: `<random strings>-<amplify env name>/<table name>.json`

```json
{
    "id":"String"
    "name":"String"
    "count":"Number"
}
```

以下は、このプロジェクト用の README ファイルの例です。プロジェクトの目的、機能、およびインストール方法を説明しています。

# CSV to DynamoDB Importer

This serverless application is designed to import CSV files from an Amazon S3 bucket into an Amazon DynamoDB table using AWS Lambda. It reads CSV files uploaded to the S3 bucket, processes them, and inserts the data into the corresponding DynamoDB table. Upon successful import, the CSV file is moved to a `completed` directory within the S3 bucket.

## Features

- Serverless architecture using AWS Lambda
- Triggered by S3 events when a new CSV file is uploaded
- Supports different column types defined in a separate JSON file
- Validates CSV headers against JSON column definitions
- Batch write to DynamoDB for efficient data insertion
- Moves successfully processed CSV files to a `completed` directory with a timestamp

## Prerequisites

- AWS account with appropriate permissions to create and manage resources
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Node.js](https://nodejs.org/) 12.x or later installed
- [AWS CDK](https://aws.amazon.com/cdk/) installed (Version 1.x)

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

4. Deploy the application to your AWS account:
   ```
   cdk deploy
   ```

## Usage

1. Upload a CSV file to the S3 bucket with the following naming convention:

   ```
   <EnvName>/<TableName>.csv
   ```

   Replace `<EnvName>` with your desired environment name and `<TableName>` with the name of the target DynamoDB table.

2. Create a JSON file containing the column definitions with the same naming convention:

   ```
   <EnvName>/<TableName>.json
   ```

   Example content:

   ```
   {
       "id": "String",
       "name": "String",
       "count": "Number"
   }
   ```

   Note: To mark a column as required, append "!" to the type, e.g., `"id": "String!"`.

3. Upload the JSON file to the same S3 bucket.

The Lambda function will automatically process the uploaded CSV file, validate it against the JSON column definitions, and insert the data into the specified DynamoDB table. If the import is successful, the CSV file will be moved to a `completed` directory within the S3 bucket.

## License

This project is open-source and available under the [MIT License](LICENSE).
