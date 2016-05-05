var Gcontact = require('../../models/gcontact');


function getContact(req, res) {
  var id = req.params.id;
  Gcontact.find({'user': id}, function(error, contacts) {

    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    console.log(id);
    res.json(contacts)
    // res.render('products/edit', {product: product});
  });

}

module.exports = {
  getContact:  getContact
}
