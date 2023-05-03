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

function getDynamoDBType(graphQLType) {
  const mapping = {
    ID: "String",
    String: "String",
    Int: "Number",
    Float: "Number",
    Boolean: "Boolean",
    AWSDateTime: "String",
    AWSDate: "String",
    AWSTime: "String",
    AWSTimestamp: "Number",
    AWSJSON: "String",
    AWSPhone: "String",
    AWSEmail: "String",
    AWSURL: "String",
    AWSIPAddress: "String",
  };

  let typeName;
  let isNonNull = false;

  if (graphQLType.kind === "NamedType") {
    typeName = graphQLType.name.value;
  } else if (
    graphQLType.kind === "NonNullType" &&
    graphQLType.type.kind === "NamedType"
  ) {
    typeName = graphQLType.type.name.value;
    isNonNull = true;
  } else {
    return null;
  }

  const dynamoDBType = mapping[typeName] || "String";
  return isNonNull ? `${dynamoDBType}!` : dynamoDBType;
}

function extractTypes(ast) {
  const typeMap = {};

  for (const definition of ast.definitions) {
    if (
      definition.kind === "ObjectTypeDefinition" &&
      definition.directives.some((d) => d.name.value === "model")
    ) {
      const fields = {};

      for (const field of definition.fields) {
        if (hasConnectionDirective(field)) {
          continue;
        }

        const fieldType = getDynamoDBType(field.type);
        if (fieldType) {
          fields[field.name.value] = fieldType;
        }
      }

      // Add required fields if they don't exist
      const requiredFields = {
        id: "String!",
        createdAt: "String!",
        updatedAt: "String!",
        __typename: "String!",
      };

      for (const [fieldName, fieldType] of Object.entries(requiredFields)) {
        if (!fields[fieldName]) {
          fields[fieldName] = fieldType;
        }
      }

      typeMap[definition.name.value] = fields;
    }
  }

  return typeMap;
}

function hasConnectionDirective(field) {
  return field.directives.some(
    (directive) =>
      directive.name.value === "hasOne" || directive.name.value === "hasMany"
  );
}
