from flask import Flask, render_template, session, redirect, url_for, request
import random

bk = Flask(__name__)
bk.secret_key = 'myblackjack'

def start_game():
    # Tạo bộ bài
    deck = [(str(v), s) for s in '♠♥♦♣' for v in list(range(2,11))+['J','Q','K','A']]
    random.shuffle(deck)
    # Chia bài ban đầu
    user_cards = [deck.pop(), deck.pop()]
    bot_cards = [deck.pop(), deck.pop()]
    session['deck'] = deck
    session['user_cards'] = user_cards
    session['bot_cards'] = bot_cards
    session['state'] = 'playing'
    session['coins'] = session.get('coins', 500)
    session['message'] = "Bắt đầu ván mới!"
    session['bet'] = 100

def calc(points):
    val, aces = 0, 0
    for v, s in points:
        if v in ['J','Q','K']:
            val += 10
        elif v == 'A':
            val += 11
            aces += 1
        else:
            val += int(v)
    while val > 21 and aces:
        val -= 10
        aces -= 1
    return val

@bk.route('/', methods=['GET','POST'])
def index():
    if 'user_cards' not in session:
        start_game()
    if request.method == 'POST':
        bet = int(request.form.get('bet',100))
        if bet > 0 and bet <= session['coins']:
            session['bet'] = bet
            start_game()
        else:
            session['message'] = "Cược không hợp lệ!"
    user_cards = session['user_cards']
    bot_cards = session['bot_cards']
    deck = session['deck']
    user_point = calc(user_cards)
    bot_point = calc(bot_cards[:1])  # chỉ hiện 1 lá bot
    message = session.get('message',"")
    coins = session.get('coins',500)
    state = session.get('state','playing')
    bet = session.get('bet', 100)
    return render_template('bj.html', user_cards=user_cards, bot_cards=bot_cards, user_point=user_point, bot_point=bot_point, message=message, coins=coins, state=state, bet=bet)

@bk.route('/hit')
def hit():
    if session.get('state') != 'playing':
        return redirect(url_for('index'))
    deck = session['deck']
    user_cards = session['user_cards']
    user_cards.append(deck.pop())
    session['user_cards'] = user_cards
    # Tính điểm
    user_point = calc(user_cards)
    if user_point > 21:
        session['state'] = 'lose'
        session['message'] = "Bạn quá 21 điểm! Thua rồi!"
        session['coins'] -= session['bet']
    return redirect(url_for('index'))

@bk.route('/stand')
def stand():
    if session.get('state') != 'playing':
        return redirect(url_for('index'))
    deck = session['deck']
    bot_cards = session['bot_cards']
    user_point = calc(session['user_cards'])
    while calc(bot_cards) < 17:
        bot_cards.append(deck.pop())
    bot_point = calc(bot_cards)
    session['bot_cards'] = bot_cards
    # So sánh điểm
    if bot_point > 21 or user_point > bot_point:
        session['state'] = 'win'
        session['message'] = "Bạn thắng!"
        session['coins'] += session['bet']
    elif user_point < bot_point:
        session['state'] = 'lose'
        session['message'] = "Bạn thua!"
        session['coins'] -= session['bet']
    else:
        session['state'] = 'draw'
        session['message'] = "Hoà!"
    return redirect(url_for('index'))

@bk.route('/next')
def next():
    start_game()
    return redirect(url_for('index'))

if __name__ == '__main__':
    bk.run(debug=True)
