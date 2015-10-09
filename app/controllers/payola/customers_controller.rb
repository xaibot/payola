module Payola
  class CustomersController < ApplicationController
    def create
      user = User.find_by(email: params[:email])

      stripe_customer = if user.stripe_customer_id.present?
        Payola::FindOrCreateCustomer.call({ stripe_customer_id: user.stripe_customer_id })
      else
        Payola::FindOrCreateCustomer.call({ stripe_token: params['stripeToken'], email: user.email })
      end

      if stripe_customer == :email_taken
        render json: { status: 'error', error: {code: 'email_taken'} }, status: 400
      else
        if user.stripe_customer_id.nil?
          user.update_attributes(stripe_customer_id: stripe_customer.id)
        end
        render json: { status: 'created'}, status: 200
      end
    end

  end
end