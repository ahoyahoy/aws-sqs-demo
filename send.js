'use strict';
//require('babel/register')({optional: ['es7']});

const config = require("./config.json");

const aws = require("aws-sdk");
const Q = require("q");
const chalk = require("chalk");

const sqs = new aws.SQS({
	region: config.aws.region,
	accessKeyId: config.aws.accessID,
	secretAccessKey: config.aws.secretKey,
	params: {
		QueueUrl: config.aws.queueUrl
	}
});

const sendMessage = Q.nbind(sqs.sendMessage, sqs);

function handleSendResolve (data) {
	console.log(chalk.green("Message sent:", data.MessageId));
}

function handleReject (error) {
	console.log(chalk.red( "Unexpected Error:", error.message));
}

let message = {
	id: new Date().getTime(),
	data: {
		foo: 'bar'
	}
}

sendMessage({
	MessageBody: JSON.stringify(message)
})
.then(handleSendResolve)
.catch(handleReject);