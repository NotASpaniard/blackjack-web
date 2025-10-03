from flask import Flask, render_template, session, redirect, url_for, request, redirect, url_for, request
import random

app = Flask(__name__)
app.secret_key = 'Parrot'

def start():
    sessionp['coins'] = 500
    sessionp['message'] = 'Chào mừng đến với địa ngục'

@app.route('/')
def index():
    if 'coins' not in session:
        start()
    coins = session['coins']
    message = session.get('message', '')
    if coins <= 0:
        return render_template('kick.html')
    if coins >= 20000:
        return render_template('win.html', coins = coins)
    return render_template('blackjack.html', coins=coins, message=message)
    
@app.route('/play', methods=['POST'])
def play():
    try:
        bet = int(request.form.get('bet', 200))
    except: 
        bet = 200
    if 'coins' not in session:
        start()
    coins = session['coins']
    if bet > 0 and bet <= coins:
        win = random.choice([True, False])
        if win:
            coins += bet
            result = f"Mày thắng {bet} cốc cà phê!"
        else:
            coins -= bet
            result = f"Mày thua {bet} cốc cà phê!"
        session['coins'] = coins
        session['message'] = result
    else:
        session['message'] = "Dme cược lại ngay!"
    return redirect(url_for('index'))

@app.route('/restart')
def restart():
    start()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)