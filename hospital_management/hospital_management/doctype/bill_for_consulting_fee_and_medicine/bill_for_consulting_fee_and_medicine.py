# Copyright (c) 2025, praveen and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BillforConsultingFeeAndMedicine(Document):



    def before_save(self):
        # Ensure Consulting Fee and Medicine Charges are valid numbers before calculation
        self.total_bill_amount = (self.consulting_fee or 0) + (self.medicine_charges or 0)
