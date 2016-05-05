var Gcontact = require('../../models/gcontact');
var Gcontact = require('../../models/gevent');

function getContactsAll(req, res) {
  var id = req.params.id;
  Gcontact.find({'user': id}, function(error, contacts) {

    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    console.log(id);
    res.json(contacts)
    // res.render('products/edit', {product: product});
  });

}

function getEventsAll(req, res) {
  var id = req.params.id;
  Gevent.find({'user': id}, function(error, events) {

    if(error) res.json({message: 'Could not find events b/c:' + error});
    console.log(id);
    res.json(events)
    // res.render('products/edit', {product: product});
  });

}

module.exports = {
  getContactsAll:  getContactsAll,
  getEventsAll: getEventsAll
}
