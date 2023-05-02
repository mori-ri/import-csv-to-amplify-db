// index.js
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const csvParser = require("csv-parser");
const stream = require("stream");

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const [envName, tableNameWithExtension] = key.split("/");
  const tableName = tableNameWithExtension.split(".")[0] + "-" + envName;

  const params = {
    Bucket: bucket,
    Key: key.replace(".csv", ".json"),
  };

  let columnTypes;
  try {
    columnTypes = await s3
      .getObject(params)
      .promise()
      .then((data) => JSON.parse(data.Body.toString("utf-8")));
  } catch (error) {
    console.error("Error retrieving JSON column definition file:", error);
    throw error;
  }

  const getObjectStream = s3
    .getObject({ Bucket: bucket, Key: key })
    .createReadStream();
  const csvStream = getObjectStream.pipe(csvParser());

  const records = [];
  let lineNumber = 0;
  for await (const record of csvStream) {
    lineNumber++;
    if (lineNumber === 1) {
      validateHeaders(record, columnTypes);
    }

    const item = {};

    for (const [column, value] of Object.entries(record)) {
      const typeDefinition = columnTypes[column];
      if (!typeDefinition) {
        throw new Error(
          `Column "${column}" is not defined in the JSON schema.`
        );
      }

      const [type, required] = typeDefinition.split("!");

      if (required && !value) {
        throw new Error(
          `Missing required value for column "${column}" at line ${lineNumber}.`
        );
      }

      item[column] = type === "Number" ? Number(value) : value;
    }

    records.push(item);

    if (records.length === 25) {
      await writeToDynamoDb(tableName, records);
      records.length = 0;
    }
  }

  if (records.length > 0) {
    await writeToDynamoDb(tableName, records);
  }

  await moveToCompletedDirectory(bucket, key);

  console.log("CSV file processed successfully.");
};

function validateHeaders(record, columnTypes) {
  const recordColumns = Object.keys(record);
  const jsonColumns = Object.keys(columnTypes);

  if (recordColumns.length !== jsonColumns.length) {
    throw new Error(
      "CSV header count does not match JSON column definition count."
    );
  }

  for (const column of recordColumns) {
    if (!jsonColumns.includes(column)) {
      throw new Error(
        `CSV header "${column}" not found in JSON column definition.`
      );
    }
  }
}

async function writeToDynamoDb(tableName, records) {
  const params = {
    RequestItems: {
      [tableName]: records.map((record) => ({
        PutRequest: {
          Item: record,
        },
      })),
    },
  };

  try {
    await dynamoDb.batchWrite(params).promise();
  } catch (error) {
    console.error("Error writing to DynamoDB:", error);
    throw error;
  }
}

async function moveToCompletedDirectory(bucket, key) {
  const now = new Date();
  const dateTimeString = now.toISOString().replace(/[:.]/g, "-");
  const [envName, tableNameWithExtension] = key.split("/");
  const newKey = `${envName}/completed/${dateTimeString}-${tableNameWithExtension}`;

  const copyParams = {
    Bucket: bucket,
    CopySource: encodeURIComponent(`${bucket}/${key}`),
    Key: newKey,
  };

  const deleteParams = {
    Bucket: bucket,
    Key: key,
  };

  try {
    await s3.copyObject(copyParams).promise();
    await s3.deleteObject(deleteParams).promise();
  } catch (error) {
    console.error("Error moving CSV file to completed directory:", error);
    throw error;
  }
}
