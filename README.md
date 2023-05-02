## Implementing bulk CSV ingestion to Amplify DynamoDB

Amplify で作成したDynamo DBにCSVファイルを一括でインポートする方法を紹介します。
AmplifyのDynamoDBは、AWSのDynamoDBとは違い、CSVファイルを一括でインポートする機能がありません。データの移行のためにCSVをダウンロードし、再度インポートするためのデザインです。

S3 のKey構成：`<gj7lclc54nbzddx67tqw3w6npy-devxx>/<table name>.csv`
setting json: `<gj7lclc54nbzddx67tqw3w6npy-devxx>/<table name>.json`

DynamoーDB table　name：Find-gj7lclc54nbzddx67tqw3w6npy-devxx


```json
{
    "id":"String"
    "name":"String"
    "count":"Number"
}
```


以下のブログを参考に作成しました。: [Implementing bulk CSV ingestion to Amazon DynamoDB](https://aws.amazon.com/blogs/database/implementing-bulk-csv-ingestion-to-amazon-dynamodb/)

You can use your own CSV file or download the test file we provided in this repo. 

Steps to Download CloudFormation template:
1. Navigate to CloudFormation folder in this repo.
2. Click on CSVToDynamo.template.
3. Click on the Raw button.
4. Save Page As > Remove any file extensions so that the file reads like "CSVToDynamo.template". Click save.

