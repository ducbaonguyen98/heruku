const mysql = require('mysql');

class MySQLClass {
	constructor() {
		this.config = {};
		this.connection = null;
	}

	setConfig(_config) {
		this.config = _config;
		this.connection = mysql.createPool(this.config);
	}

	query(str, values) {
		return new Promise((resolve, reject) => this.connection.query(str, values, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		}));
	}
	
	exists(str, values) {
		if (typeof str != 'string' || str.indexOf('SELECT ') !== 0) {
			return Promise.reject('queryExists(): invalid SELECT query');
		}
		
		return this.query(str, values)
			.then(rows => rows && rows.length > 0 ? rows[0] : false);
	}
	
	callProc(procedure) {
		return arguments.length > 1 ?
			this.query('CALL ??(?)', [procedure, Array.prototype.slice.call(arguments, 1)]) :
			this.query('CALL ??()', [procedure]);
	}
	
	callFunc(func) {
		const promise = arguments.length > 1 ?
			this.query('SELECT ??(?) AS `result`', [func, Array.prototype.slice.call(arguments, 1)]) :
			this.query('SELECT ??() AS `result`', [func]);
		
		return promise.then(rows => rows && rows.length > 0 ? rows[0].result : Promise.reject('queryFunc(): no return value'));
	}
	
	get(str, values) {
		if (typeof str != 'string' || str.indexOf('SELECT ') !== 0) {
			return Promise.reject('queryGet(): invalid SELECT query');
		}
		
		return this.query(str, values).then(rows => rows && rows.length > 0 ? rows[0] : Promise.reject('queryGet(): no data'));
	}
	
	fetch(str, values) {
		if (typeof str != 'string' || str.indexOf('SELECT ') !== 0) {
			return Promise.reject('queryFetch(): invalid SELECT query!!!');
		}
		
		return this.query(str, values).then(rows => rows && rows.length > 0 ? rows : []);
	}
	
	insert(table, data) {
		if (table && data && typeof data == 'object') {
			return this.query('INSERT IGNORE INTO ?? SET ?', [table, data]).then(result => result.insertId);
		}
		return Promise.reject('queryInsert(): invalid table or data');
	}
	
	insert2(table, fields, rows, mapValues) {
		var qf = fields.join('`,`');
		var qs = rows.map(r => '(?)').join(',');
		var query_str = 'INSERT IGNORE INTO `' + table + '` (`' + qf + '`) VALUES ' + qs;
		var values = rows.map(mapValues);
		return this.query(query_str, values);
	}
	
	update2(table, data, n1, v1, n2, v2) {
		if (table && data && typeof data == 'object' && n1 && n2) {
			return this.query('UPDATE ?? SET ? WHERE ??=? AND ??=?', [table, data, n1, v1, n2, v2]).then(result => result.affectedRows);
		}
		return Promise.reject('queryUpdate2(): invalid table, data or params');
	}
	
	updateId(table, data, id) {
		if (table && data && typeof data == 'object' && id) {
			return this.query('UPDATE ?? SET ? WHERE `id`=?', [table, data, id]).then(result => result.affectedRows);
		}
		return Promise.reject('queryUpdateId(): invalid table, data or id');
	}
	
	delete1(table, n, v) {
		if (table && n) {
			return this.query('DELETE FROM ?? WHERE ??=?', [table, n, v]).then(result => result.affectedRows);
		}
		return Promise.reject('queryDelete1(): invalid table or params');
	}
	
	delete2(table, n1, v1, n2, v2) {
		if (table && n1 && n2) {
			return this.query('DELETE FROM ?? WHERE ??=? AND ??=?', [table, n1, v1, n2, v2]).then(result => result.affectedRows);
		}
		return Promise.reject('queryDelete2(): invalid table or params');
	}
	
	deleteId(table, id) {
		if (table && id) {
			return this.query('DELETE FROM ?? WHERE `id`=?', [table, id]).then(result => result.affectedRows);
		}
		return Promise.reject('queryDeleteId(): invalid table or id');
	}
}

module.exports = MySQLClass;