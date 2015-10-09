module Payola
  class FindOrCreateCustomer
    #
    # it expects params to be either { stripe_customer_id: 'XXX' } OR { stripe_token: 'YYY', email: 'whoever@example.com' }
    #
    def self.call(params)
      secret_key = Payola.secret_key

      if params[:stripe_customer_id].present?
        Stripe::Customer.retrieve(params[:stripe_customer_id], secret_key)
      else
        if Stripe::Customer.all.data.select{|k| k.email == params[:email] }.size > 0
          :email_taken
        else
          Stripe::Customer.create({
            source: params[:stripe_token],
            email: params[:email]
          }, secret_key)
        end
      end
    end

  end
end