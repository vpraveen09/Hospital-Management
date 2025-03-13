// Copyright (c) 2025, praveen and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Medicine Master", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Medicine Master', {
    unit_price: function(frm) {
        calculate_price(frm);
    },
    stock_quantity: function(frm) {
        calculate_price(frm);
    }
});

function calculate_price(frm) {
    let unit_price = frm.doc.unit_price || 0;
    let stock_quantity = frm.doc.stock_quantity || 0;
    let total_price = unit_price * stock_quantity;
    
    frm.set_value('price', total_price.toFixed(2)); // Formats price to 2 decimal places
}
frappe.ui.form.on('Medicine Master', {
    after_save: function(frm) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Medicine saved successfully!'),
            indicator: 'green'
        });

        // Redirect after 5 seconds (5000 milliseconds)
        setTimeout(function() {
            frappe.set_route('List', 'Medicine Master'); // Redirect to Patient Master list
        }, 2000);
    }
});