// Copyright (c) 2025, praveen and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Patient Master", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Patient Master', {
    after_save: function(frm) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Patient Created successfully!'),
            indicator: 'green'
        });

        // Redirect after 5 seconds (5000 milliseconds)
        setTimeout(function() {
            frappe.set_route('List', 'Patient Master'); // Redirect to Patient Master list
        }, 2000);
    }
});
