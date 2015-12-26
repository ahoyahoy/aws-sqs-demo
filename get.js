'use strict';
//require('babel/register')({optional: ['es7']});

const config = require( './config.json' );

const aws = require('aws-sdk');
const Q = require('q');
const chalk = require('chalk');

const sqs = new aws.SQS({
	region: config.aws.region,
	accessKeyId: config.aws.accessID,
	secretAccessKey: config.aws.secretKey,
	params: {
		QueueUrl: config.aws.queueUrl
	}
});

const receiveMessage = Q.nbind(sqs.receiveMessage, sqs);
const deleteMessage = Q.nbind(sqs.deleteMessage, sqs);


function handleMessageResolve (data) {
	if (!data.Messages) {
		throw(
			workflowError(
				'EmptyQueue',
				new Error('There are no messages to process.')
			)
		);
	}
	let message = data.Messages[0];
	let body = JSON.parse(message.Body);
	console.log(chalk.yellow('Message'), JSON.stringify(body, null, 2));
	return deleteMessage({ ReceiptHandle: data.Messages[ 0 ].ReceiptHandle });
}

function handleDeleteResolve (data) {
	console.log(chalk.green('Message Deleted!'));
}

function handleError (error) {
	switch (error.type) {
		case 'EmptyQueue':
			console.log(chalk.cyan('Expected Error:', error.message));
		break;
		default:
			console.log(chalk.red('Unexpected Error:', error.message));
		break;
	}
}

function workflowError (type, error) {
	error.type = type;
	return(error);
}

function pollQueueForMessages () {
	console.log('Pool Message');
	receiveMessage({
		WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
		VisibilityTimeout: 10
	})
	.then(handleMessageResolve)
	.then(handleDeleteResolve)
	.catch(handleError)
	.finally(pollQueueForMessages);
}

pollQueueForMessages();
