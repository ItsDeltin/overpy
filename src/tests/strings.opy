#!optimizeForSize
#!setupTx

globalvar owo
rule "strings":
    print("custom 'string'")
    print("new\nline")
    print("qu\"o\"tes")
    print("zero width space: |\z|")
    print("")
    print(l"")
    print('single \'"quotes"')
    print(w"fullwidth string")
    print(b"big letters string")
    print(l"{0} {1}".format("localized", "string"))
    print(l"{0}, {1}, and {2}".format(0,1,2))

    A = w"uwu {0}".format(C)
    A = f"owo {1+2}"
    B = fb'123145{C} {A+B} {0}'
    B = wf'fullwidth a{A+B}f'
    B = cf'lowercase a{owo}f'

    print("Multiple fields {} {} {} {} {} {} {} {}".format(A,B,C,D,E,F,G,H))
    print("Numbered fields {0} {1} {2} {1} {3}".format(A,B,C,D))
    print("Numbered fields 2 {1}{0}{2}{1}".format(A,B,C))
    print("Missing field: {0} {2}".format(A,B,C))
    print("Missing field 2: {1} {2}".format(A,B,C))
    print("Null fields: {0} {1} {2}".format(null, null, null))
    print(w"Very long string that will need to be splitted along several strings, as it is fullwidth and takes more than 128 characters which is the limit")
    print("String with entities: a\&black_square;b\&fullwidth_space;c")
    print("String with \x01 hex escape and \u2000 unicode escape")
    print(c"Case-sensitive string")
    print("multiline
string")
    print("{} <fgFF00FFFF>texture test</fg> {} <txC0000000002DD21> {}".format(A,B,C))
    print("{1} <fgFF00FFFF>texture test</fg> {2} <txC0000000002DD21> {0}".format(A,B,C))
    print("<txC0000000002DD21>")
    print("<txc12345> <tx{}>".format(3))
    print("<tx{}>".format(A))
    print("Optimized strings: {1} {0}{2} {3}".format(123, 123.455, "|string|", A))
    print("Optimized strings 2: {} {} {}{} {} {}".format(A, 0.125, 0.1, Texture.MOUSE_CURSOR, B, "other string {0}{0}".format(C)))
    print("Optimized strings 3: {}".format("|str1|{}|str2|".format(A)))


    A = ["a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a",]

    A = "a,b,c".split(",")
    A = "abc".strIndex("b")
    A = "a,b,c".replace(",",";")
    A = "abc".charAt(1)

    #!define 120_CHARS "|_____________________________________________________________________________________________________________120 chars|"

    A = "{}{}{}".format(120_CHARS, 120_CHARS, 120_CHARS)
    A = "{}{}{}{}{}".format(A,B,C, 120_CHARS, D)
    #should not be split
    A = "{}12345678".format(120_CHARS)
    #should be split
    A = "{}123456789".format(120_CHARS)
    #should not be split
    A = "{}12345{}".format(120_CHARS, A)
    A = "{}1234{}5".format(120_CHARS, A)
    A = "{}123{}56".format(120_CHARS, A)
    A = "{}12{}456".format(120_CHARS, A)
    A = "{}12{}{}".format(120_CHARS, A,B)
    A = "{}1{}{}2".format(120_CHARS, A,B)
    A = "{}{}1{}2".format(120_CHARS, A,B)
    #should be split
    A = "{}123456{}".format(120_CHARS, A)
    A = "{}12345{}6".format(120_CHARS, A)
    A = "{}1234{}56".format(120_CHARS, A)
    A = "{}123{}456".format(120_CHARS, A)
    A = "{}123{}{}4".format(120_CHARS, A, B)
    A = "{}123{}4{}".format(120_CHARS, A, B)
    A = "{}12{}34{}".format(120_CHARS, A, B)
    A = "{}12{}3{}4".format(120_CHARS, A, B)
    A = "{}1{}2{}34".format(120_CHARS, A, B)
    A = "{}{}{}{}".format(120_CHARS, A, B, C)

    A = "[{1}] LEAVE EDIT MODE\n{2} CREATE BOT\n{3} GRAB BOT\n[{4}] REMOVE BOT\n[{0}] + [{4}] REMOVE ALL BOTS\n[{5}] PLACE RESET MARKER\n[{0}] + [{5}] REMOVE RESET MARKER\n[{6}] INCREASE PLACEMENT DISTANCE\n[{0}] + [{6}] DECREASE PLACEMENT DISTANCE".format(A,B,C,D,E,F, G)
    A =  "{1} CREATE BOT {2}\n{3} GRAB BOT\n[{4}] REMOVE BOT\n[{0}] + [{4}] REMOVE ALL BOTS\n[{4}] PLACE RESET MARKER\n[{0}] + [{4}] REMOVE RESET MARKER\n[{5}] INCREASE PLACEMENT DISTANCE\n[{0}] + [{5}] DECREASE PLACEMENT DISTANCE".format(A,B,C,D,E,F)
