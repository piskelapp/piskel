npm run unit-tests
UT=$?
npm run e2e
E2E=$?
exit $((UT + E2E))