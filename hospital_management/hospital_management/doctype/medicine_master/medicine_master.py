# Copyright (c) 2025, praveen and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class MedicineMaster(Document):

#     def before_insert(self):
#         """Fetch unit price from Medicine Master when medicine is selected"""
#         if self.medicine_id:
#             self.unit_price = frappe.db.get_value("Medicine Master", self.medicine_id, "price") or 0
#             self.total_price = self.unit_price * (self.quantity or 1)
import frappe
from frappe.model.document import Document

class  MedicineMaster(Document):
    def before_save(self):
        if self.unit_price and self.stock_quantity:
            self.price = self.unit_price * self.stock_quantity
