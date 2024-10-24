import alasql from "alasql";
export const hymnos_db = new alasql.Database();

export function initDb(): void {
    const hymns_json = {}
    // Create IndexdDB database and fill it with data from array
    alasql('CREATE INDEXEDDB DATABASE IF NOT EXISTS HymnosDB;\
        ATTACH INDEXEDDB DATABASE HymnosDB; \
        USE HymnosDB; \
        CREATE TABLE IF NOT EXISTS hymns; \
        SELECT * INTO hymns FROM ?', [hymns_json], function () {

        // // Select data from IndexedDB
        // alasql.promise('SELECT COLUMN * FROM cities WHERE population > 100000 ORDER BY city DESC')
        //     .then(function (res) {
        //         document.write('Big cities: ', res.join(','));
        //     });
    });
}

