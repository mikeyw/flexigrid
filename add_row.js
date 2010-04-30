// REQUIRES jQuery

/* Add a new row to the top of the table
 *
 * table_id - The table to add the row to
 * rows - The array of row Objects to add
 */
function flexigrid_add_row(table_id,rows){
  var options =  $(table_id).flexGetOptions();
  var data = $(table_id).flexGetData();
  var i;

  // Remove duplicate items from rows - this allows us to 
  // modify an existing rows and move them to the top of the grid.
  for(i = 0; i < rows.length; i++){
    for(var j = 0; j < data.rows.length; j++){
      if(rows[i] !== null && data.rows[j].id == rows[i].id){
        rows.splice(i,1);
        i--;
      }
    }
  }

  var rows_length = rows.length;
  if(rows_length < 1) { return; }
  data.total = data.total + rows.length;

  // If we are using pages then we need to keep the page size
  if(options.userpager === false || options.rp >= data.total){
    data.rows = rows.concat(data.rows);
  }else{
    for(i = data.rows.length; i > rows_length; i--){
      rows[i-1] = data.rows[i - rows_length - 1];
    }
    data.rows = rows;
  }

  $(table_id).flexAddData(data);
}
