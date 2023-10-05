const db = require("./db");
const crypto = require("crypto");

exports.getUserId = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM users WHERE id = ?";
		db.get(sql, [id], (err, row) => {
			if (err) reject(err);
			else if (row == undefined) resolve({ error: "User not found" });
			else {
				const user = {
					id: row.id,
					username: row.email,
					name: row.name,
					role: row.role,
				};
				resolve(user);
			}
		});
	});
};

exports.getUser = (email, password) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM users WHERE email = ?";
		db.get(sql, [email], (err, row) => {
			if (err) reject(err);
			else if (row == undefined) resolve(false);
			else {
				const user = {
					id: row.id,
					username: row.email,
					name: row.name,
					role: row.role,
				};

				const salt = row.salt;
				crypto.scrypt(password, salt, 64, (err, hasedPassword) => {
					if (err) reject(err);

					const passwordHex = Buffer.from(row.password, "hex");

					if (!crypto.timingSafeEqual(passwordHex, hasedPassword))
						resolve(false);
					else resolve(user);
				});
			}
		});
	});
};

exports.getUsers = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM users";
		db.all(sql, [], (err, rows) => {
			if (err) reject(err);
			else {
				const users = rows.map((u) => ({
					id: parseInt(u.id),
					username: u.email,
					name: u.name,
					role: u.role,
				}));

				resolve(users);
			}
		});
	});
};
