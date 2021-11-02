#!/bin/bash
#set -x

export PROJECT_ROOT=$(dirname $(dirname $(realpath ${0})))

$PROJECT_ROOT/build

echo "### Docker tag to dit-${USER}"
docker tag docker-io.dbc.dk/opencat-business-service:devel docker-personal.artifacts.dbccloud.dk/$USER/opencat-business-service:dit

echo "### Docker push image"
docker push docker-personal.artifacts.dbccloud.dk/$USER/opencat-business-service:dit

echo "### Setting docker image in dit-${USER}"
kubectl -n dit-${USER} set image deployment/opencat-business-service opencat-business-service=docker-personal.artifacts.dbccloud.dk/$USER/opencat-business-service:dit
kubectl -n dit-${USER} rollout restart deployment opencat-business-service
kubectl -n dit-${USER} rollout status deployment --watch --timeout=180s opencat-business-service
