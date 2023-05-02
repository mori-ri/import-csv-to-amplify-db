// graphql_to_csv_json/index.js
const AWS = require("aws-sdk");
const { parse } = require("graphql");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const [envName, tableNameWithExtension] = key.split("/");

  const getObjectStream = s3
    .getObject({ Bucket: bucket, Key: key })
    .createReadStream();

  const data = await getObjectStreamToString(getObjectStream);

  const typeMap = extractTypes(parse(data));

  for (const [typeName, type] of Object.entries(typeMap)) {
    const jsonDefinition = JSON.stringify(type, null, 2);
    const putObjectParams = {
      Bucket: bucket,
      Key: `${envName}/${typeName}.json`,
      Body: jsonDefinition,
    };
    await s3.putObject(putObjectParams).promise();
  }

  console.log("GraphQL schema processed successfully.");
};

function getObjectStreamToString(readStream) {
  return new Promise((resolve, reject) => {
    let data = "";

    readStream.on("data", (chunk) => {
      data += chunk;
    });

    readStream.on("end", () => {
      resolve(data);
    });

    readStream.on("error", reject);
  });
}

function extractTypes(ast) {
  const typeMap = {};

  for (const definition of ast.definitions) {
    if (definition.kind === "ObjectTypeDefinition") {
      const fields = {};

      for (const field of definition.fields) {
        const fieldType =
          field.type.kind === "NonNullType" ? "String!" : "String";
        fields[field.name.value] = fieldType;
      }

      typeMap[definition.name.value] = fields;
    }
  }

  return typeMap;
}
