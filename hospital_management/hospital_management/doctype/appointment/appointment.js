// Copyright (c) 2025, praveen and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Appointment", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Appointment', {
    after_save: function(frm) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Appointment Created Successfully!'),
            indicator: 'green'
        });

        // Redirect to Patient Master after a short delay
        setTimeout(function() {
            frappe.set_route('Form', 'Appointment', frm.doc.patient);
        }, 2000); // 2-second delay
    }
});
