module Payola
  class ChangeSubscriptionPlan
    def self.call(subscription, plan)
      secret_key = Payola.secret_key_for_sale(subscription)
      old_plan = subscription.plan

      begin
        customer = Stripe::Customer.retrieve(subscription.stripe_customer_id, secret_key)
        sub = customer.subscriptions.retrieve(subscription.stripe_id)

        prorate = plan.respond_to?(:should_prorate?) ? plan.should_prorate?(subscription) : true
        # trial_end = plan.respond_to?(:trial_end) ? plan.trial_end(subscription, plan) : nil

        # sub.trial_end = trial_end unless trial_end.nil?
        sub.plan = plan.stripe_id
        sub.prorate = prorate
        sub.save

        invoice_right_away = plan.respond_to?(:should_invoice_right_away?) ? plan.should_invoice_right_away?(subscription) : false
        if invoice_right_away
          invoice = Stripe::Invoice.create(customer: subscription.stripe_customer_id)
          invoice.pay
        end

        subscription.plan = plan
        subscription.save!

        subscription.instrument_plan_changed(old_plan)

      rescue RuntimeError, Stripe::StripeError => e
        subscription.errors[:base] << e.message
      end

      subscription
    end
  end
end
