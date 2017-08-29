#!/bin/bash
# We get the aws_access_key_id, aws_secret_access_key and region from the files where aws save the information
aws_access_key_id_string=`cat $HOME/.aws/credentials | grep aws_access_key_id`
aws_secret_access_key_string=`cat $HOME/.aws/credentials | grep aws_secret_access_key`
region=`cat $HOME/.aws/config | grep region`

IFS=' = ' read -ra KEYID <<< "$aws_access_key_id_string"

IFS=' = ' read -ra AKEY <<< "$aws_secret_access_key_string"

IFS=' = ' read -ra REGION <<< "$region"

# We run the command in a dockerfile to prevent package version errors. It's only necessary to have docker installed
docker build --build-arg "IOT_ENDPOINT=$(aws iot describe-endpoint --region=${REGION[1]} --output text)" --build-arg "REGION=${REGION[1]}" -t deploy-chromeless-git-version -f dockerfiles/Dockerfile.deploy .
docker run -e "AWS_SECRET_ACCESS_KEY=${AKEY[1]}" -e "AWS_ACCESS_KEY_ID=${KEYID[1]}" -ti deploy-chromeless-git-version