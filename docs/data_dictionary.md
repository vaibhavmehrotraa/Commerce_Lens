# Data Dictionary

Full column reference for `data/commerce_sessions.csv` / `.parquet`. Generated from `data/data_dictionary.csv` — edit that file, not this one, if columns change.

**53 columns** — 38 raw, 15 derived.

| Column | Type | Scale | Raw/Derived | Description | Example |
|---|---|---|---|---|---|
| `session_id` | string | nominal | raw | Unique identifier for one customer shopping session | SESS1000042 |
| `customer_id` | string | nominal | raw | Identifier for the customer who owns the session (customers can have multiple sessions) | CUST100042 |
| `session_date` | date | interval | raw | Calendar date the session occurred | 2025-03-14 |
| `day_of_week` | string | nominal | derived | Day name derived from session_date | Saturday |
| `hour` | integer | interval | raw | Hour of day the session started (0-23) | 20 |
| `season` | string | nominal | derived | Marketing season/period bucket derived from the month | Festive Season |
| `customer_age` | integer | ratio | raw | Customer age in years | 29 |
| `gender` | string | nominal | raw | Self-reported gender | Female |
| `income_level` | string | ordinal | raw | Household income bracket | Upper-Middle |
| `city_tier` | string | ordinal | raw | City classification tier (1 = largest metros) | Tier 1 |
| `device` | string | nominal | raw | Device used for this session | Mobile |
| `acquisition_channel` | string | nominal | raw | Marketing channel that originally acquired the customer | Paid Search |
| `customer_segment` | string | ordinal | derived | Behavioral segment based on historical order count (New/Occasional/Regular/Loyal) | Loyal |
| `previous_orders` | integer | ratio | raw | Number of orders placed by this customer prior to the observation window | 6 |
| `days_since_last_order` | float | ratio | raw | Days since the customer's previous order (missing for New customers) | 18 |
| `session_duration_min` | float | ratio | raw | Total session duration in minutes | 7.42 |
| `pages_viewed` | integer | ratio | raw | Number of pages viewed in the session | 11 |
| `products_viewed` | integer | ratio | raw | Number of distinct products viewed in the session | 6 |
| `searches` | integer | ratio | raw | Number of on-site searches performed | 2 |
| `add_to_cart` | boolean | nominal | raw | Whether the session included at least one add-to-cart event | True |
| `cart_items` | integer | ratio | raw | Number of items added to cart (0 if add_to_cart is False) | 3 |
| `wishlist_added` | boolean | nominal | raw | Whether an item was added to the wishlist | False |
| `discount_exposed` | boolean | nominal | raw | Whether the customer was exposed to a discount during the session | True |
| `discount_pct` | float | ratio | raw | Discount percentage exposed (0 if not discount_exposed) | 15 |
| `free_shipping` | boolean | nominal | raw | Whether free shipping was offered | True |
| `campaign_exposed` | boolean | nominal | raw | Whether the session was exposed to a marketing campaign | True |
| `campaign_type` | string | nominal | raw | Type of campaign exposed (None if not campaign_exposed) | Flash Sale |
| `offer_type` | string | nominal | raw | Type of promotional offer exposed (None if not campaign_exposed) | Percentage Off |
| `offer_value` | float | ratio | raw | Monetary value of the offer in INR (0 if not campaign_exposed) | 150 |
| `estimated_delivery_days` | integer | ratio | raw | Estimated delivery time quoted to the customer | 4 |
| `delivery_delay_days` | integer | ratio | raw | Additional days beyond the estimate the order was delayed (0 if on time) | 0 |
| `customer_rating_history` | float | interval | raw | Customer's average historical rating given to past orders | 4.2 |
| `payment_method` | string | nominal | raw | Payment method used or selected | UPI |
| `category` | string | nominal | raw | Product category browsed/purchased | Electronics |
| `price_band` | string | ordinal | derived | Price tier of the item(s) viewed (Budget/Value/Premium/Luxury) | Premium |
| `items_purchased` | integer | ratio | raw | Number of items purchased in the session (0 if purchase is False) | 2 |
| `purchase` | boolean | nominal | raw | Whether the session resulted in a completed purchase (the central outcome variable) | True |
| `order_value` | float | ratio | raw | Total order value in INR (0 if purchase is False) | 2450.5 |
| `returned` | boolean | nominal | raw | Whether the order was later returned (only possible if purchase is True) | False |
| `return_days` | integer | ratio | raw | Days after purchase the return was initiated (0 if not returned) | 0 |
| `customer_satisfaction` | float | interval | raw | Post-purchase satisfaction rating 1-5 (null if not purchased) | 4.1 |
| `profit_margin_pct` | float | ratio | raw | Profit margin percentage on the order (null if not purchased) | 18.4 |
| `repeat_customer` | boolean | nominal | derived | Whether the customer is not a first-time (New) customer | True |
| `high_intent_session` | boolean | nominal | derived | Session flagged as high purchase-intent (top-quartile products viewed + add-to-cart + above-median duration) | True |
| `engagement_score` | float | ratio | derived | 0-100 composite score blending duration/pages/products/searches/cart activity (min-max weighted blend) | 64.3 |
| `discount_dependency` | float | ratio | derived | 0-1 score indicating how reliant the session's behavior was on discount exposure | 0.55 |
| `cart_conversion` | boolean | nominal | derived | Whether a cart was converted to a purchase (null if add_to_cart is False, otherwise same as purchase) | True |
| `customer_total_spend` | float | ratio | derived | Sum of order_value across all of this customer's sessions in the dataset | 8420.15 |
| `customer_avg_order_value` | float | ratio | derived | customer_total_spend divided by the customer's number of purchases in the dataset | 2105.03 |
| `customer_return_rate` | float | ratio | derived | Share of this customer's purchases in the dataset that were returned | 0.25 |
| `customer_value_segment` | string | ordinal | derived | Value tier from customer_total_spend quartiles (High/Mid/Low Value/No Purchase Yet) | High Value |
| `time_since_previous_purchase_days` | float | ratio | derived | Alias of days_since_last_order used in waiting-time analyses | 18 |
| `next_purchase_days` | float | ratio | derived | Simulated days until the customer's next purchase (exponential draw parameterized by segment rate; modeling illustration -- not an observed outcome) | 12.4 |
