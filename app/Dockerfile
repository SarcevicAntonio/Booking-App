# sets up simple http server for hosting webapp

FROM node:14.15.4-alpine3.10

WORKDIR /app
COPY ./ /app
RUN npm install
RUN npm run-script build

FROM python:3.6

COPY --from=0 /app/build /build
WORKDIR /build
CMD python -m http.server
