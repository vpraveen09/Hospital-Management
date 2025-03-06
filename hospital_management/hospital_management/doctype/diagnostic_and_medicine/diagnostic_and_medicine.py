# Copyright (c) 2025, praveen and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class DiagnosticAndMedicine(Document):
	pass

import frappe
from frappe.model.document import Document


class DiagnosticAndMedicine(Document):

    def validate(self):
        """Calculate total quantity and price for each prescribed medicine."""
        overall_total = 0  # Initialize overall total

        if hasattr(self, 'medicine') and isinstance(self.medicine, list):
            for item in self.medicine:
                # Calculate total quantity
                # item.quantity = (item.morning or 0) + (item.evening or 0) + (item.night or 0)

                # Calculate total price (Qty × Price per unit)
                item.total = item.qty * (item.price or 0)

                # Accumulate total amount
                overall_total += item.total

        # Assign the overall total amount to a field (e.g., self.total_amount)
        self.total_amount = overall_total

