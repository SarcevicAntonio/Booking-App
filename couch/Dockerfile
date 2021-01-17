# sets up couchdb and applies cors.ini

## todo: setup users for couch

FROM couchdb:2.1.1

COPY cors.ini /opt/couchdb/etc/local.d/cors.ini
RUN sed -e '/^\[admins\]$/a admin=admin\n' -i /opt/couchdb/etc/local.ini

