const mysql = require('mysql');
const cron = require('node-cron');
const got = require('got');

const connection = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'codecap_db' });

connection.connect((err) => {
	if (err) {
		console.log("00 - Couldn't connect to the database.");
		process.exit();
	}
});

cron.schedule('10 * * * * *', () => {

	connection.query("SELECT * FROM `jobs` WHERE `job_for`='nodejs' AND `job_active`='Y'", (err, result) => {
		if (err) {
			console.log("01 Couldn't execute the query.")
		};

		if (result.length > 0) {

			result.forEach(row => {

				content = JSON.parse(row.job_content);

				if (content.type === 'or_reg_ip_details') {

					(async () => {

						try {

							url = 'http://ipinfo.io/' + content.ip + '/json';
							const response = await got(url, {responseType: 'json', resolveBodyOnly: true});

							connection.query("UPDATE `organisers` SET `or_reg_ip_details` = '"+JSON.stringify(response)+"' WHERE `or_id` = '"+content.or_id+"'", (err) => {
								if (err) {
									console.log("03 Couldn't execute the query.")
								};
								connection.query("UPDATE `jobs` SET `job_active`='N', `job_completed`=CURRENT_TIMESTAMP WHERE `job_id` = '"+row.job_id+"'", (err, result) => {
									if (err) {
										console.log("04 Couldn't execute the query.")
									};
								});
							});

						} catch (err) {
							console.log("02 Couldn't send request");
						}

					})();

				}

			});

		}
	});
});

