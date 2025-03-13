// Copyright (c) 2025, praveen and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Bill for Consulting Fee And Medicine", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Bill for Consulting Fee And Medicine", {
    refresh: function (frm) {
        console.log("Form Refreshed - Checking Field Events");
    },

    consulting_fee: function (frm) {
        console.log("Consulting Fee Changed: ", frm.doc.consulting_fee);
        update_total_bill_amount(frm);
    },

    medicine_charges: function (frm) {
        console.log("Medicine Charges Changed: ", frm.doc.medicine_charges);
        update_total_bill_amount(frm);
    }
});

// Function to update total bill amount dynamically
function update_total_bill_amount(frm) {
    let consulting_fee = frm.doc.consulting_fee || 0;
    let medicine_charges = frm.doc.medicine_charges || 0;

    let total_bill = consulting_fee + medicine_charges;
    
    console.log(`Updating Total Bill Amount: ${total_bill}`);

    frm.set_value("total_bill_amount", total_bill);
}
frappe.ui.form.on('Bill for Consulting Fee And Medicine', {
    after_save: function(frm) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Bill Created successfully!'),
            indicator: 'green'
        });

        // Redirect after 5 seconds (5000 milliseconds)
        setTimeout(function() {
            frappe.set_route('List', 'Bill for Consulting Fee And Medicine'); // Redirect to Patient Master list
        }, 2000);
    }
});