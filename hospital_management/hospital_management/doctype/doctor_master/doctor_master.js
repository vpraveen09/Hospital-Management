// Copyright (c) 2025, praveen and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Doctor Master", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Doctor Master", {
    refresh: function(frm) {
        // Hide the connections "+" button
        $(".form-links .btn-xs").hide();
    }
});
frappe.ui.form.on('Doctor Master', {
    after_save: function(frm) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Doctor Created Successfully!'),
            indicator: 'green'
        });

        // Redirect after 5 seconds (5000 milliseconds)
        setTimeout(function() {
            frappe.set_route('List', 'Doctor Master'); // Redirect to Patient Master list
        }, 2000);
    }
});