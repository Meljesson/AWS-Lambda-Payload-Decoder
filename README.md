# AWS-Lambda-Payload-Decoder

An AWS Lambda function used for decoding IoT payloads that are sent to IoT core. Payload is decoded from base64 encoded string to 
readable json data which is then sent to a dynamoDB for other analytics uses.