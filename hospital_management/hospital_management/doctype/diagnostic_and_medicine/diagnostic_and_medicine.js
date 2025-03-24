
frappe.ui.form.on("Diagnostic And Medicine", {
    refresh: function (frm) {
        console.log("Form refreshed");
        calculate_total_amount(frm);
    },
    after_save: function (frm) {
        console.log("Form saved successfully");
        redirect_to_doctor_master(frm);
    },
    on_submit: function (frm) {
        console.log("Form submitted successfully");
        redirect_to_doctor_master(frm);
    }
});

// Function to redirect to Doctor Master after saving or submitting
function redirect_to_doctor_master(frm) {
    frappe.msgprint({
        title: __("Success"),
        message: __("Diagnostic And Medicine Submitted"),
        indicator: "green"
    });

    setTimeout(() => {
        frappe.set_route("List", "Appointment"); // Redirect to the list of Doctor Master
    }, 2000); // Delay for better user experience
}

frappe.ui.form.on("Medicine Prescribed", {
    morning: function (frm, cdt, cdn) {
        console.log("Morning field changed");
        update_medicine_totals(frm, cdt, cdn);
    },
    evening: function (frm, cdt, cdn) {
        console.log("Evening field changed");
        update_medicine_totals(frm, cdt, cdn);
    },
    night: function (frm, cdt, cdn) {
        console.log("Night field changed");
        update_medicine_totals(frm, cdt, cdn);
    },
    price: function (frm, cdt, cdn) {
        console.log("Price field changed");
        update_medicine_totals(frm, cdt, cdn);
    }
});

// Function to update medicine totals per row
function update_medicine_totals(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (!row) {
        console.log("Row data not found!");
        return;
    }

    console.log("Updating row:", row);

    // Calculate quantity: morning + evening + night
    row.qty = (row.morning || 0) + (row.evening || 0) + (row.night || 0);
    console.log(`Calculated qty: ${row.qty}`);

    // Calculate total price: qty * price per unit
    row.total = row.qty * (row.price || 0);
    console.log(`Calculated total: ${row.total}`);

    // Update the row in the child table
    frm.refresh_field("medicine");

    // Recalculate overall total amount
    calculate_total_amount(frm);
}

// Function to calculate overall total amount
function calculate_total_amount(frm) {
    let overall_total = 0;

    if (frm.doc.medicine && frm.doc.medicine.length > 0) {
        frm.doc.medicine.forEach(item => {
            overall_total += item.total || 0;
        });
    }

    console.log(`Overall Total Amount: ${overall_total}`);

    // Update total amount in the main form
    frm.set_value("total_amount", overall_total);
}

